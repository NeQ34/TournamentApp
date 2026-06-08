package Lab_spec.tournament_backend.service;

import Lab_spec.tournament_backend.model.*;
import Lab_spec.tournament_backend.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SwissService {

    private final SwissRoundRepository swissRoundRepository;
    private final SwissPairingRepository swissPairingRepository;
    private final SwissStandingRepository swissStandingRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;

    public SwissService(SwissRoundRepository swissRoundRepository,
                        SwissPairingRepository swissPairingRepository,
                        SwissStandingRepository swissStandingRepository,
                        TournamentRepository tournamentRepository,
                        TeamRepository teamRepository) {
        this.swissRoundRepository = swissRoundRepository;
        this.swissPairingRepository = swissPairingRepository;
        this.swissStandingRepository = swissStandingRepository;
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
    }

    // Inicjalizacja systemu szwajcarskiego
    @Transactional
    public void initializeSwiss(Long tournamentId, int numberOfRounds, int startHour) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        // Usuń stare dane
        swissPairingRepository.deleteByRoundTournamentId(tournamentId);
        swissRoundRepository.deleteByTournamentId(tournamentId);
        swissStandingRepository.deleteByTournamentId(tournamentId);

        // Utwórz WSZYSTKIE rundy od razu
        for (int i = 1; i <= numberOfRounds; i++) {
            SwissRound round = new SwissRound();
            round.setTournament(tournament);
            round.setRoundNumber(i);
            round.setIsCompleted(false);
            swissRoundRepository.save(round);
        }

        // Utwórz ranking początkowy
        List<Team> teams = teamRepository.findByTournamentId(tournamentId);
        for (Team team : teams) {
            SwissStanding standing = new SwissStanding();
            standing.setTournament(tournament);
            standing.setTeam(team);
            standing.setPoints(0);
            standing.setWins(0);
            standing.setDraws(0);
            standing.setLosses(0);
            swissStandingRepository.save(standing);
        }

        // Wygeneruj pierwszą rundę
        generateFirstRound(tournamentId);
    }

    // Generowanie pierwszej rundy (losowanie)
    private void generateFirstRound(Long tournamentId) {
        SwissRound firstRound = swissRoundRepository.findByTournamentIdAndRoundNumber(tournamentId, 1).orElseThrow();
        List<Team> teams = teamRepository.findByTournamentId(tournamentId);
        Collections.shuffle(teams);

        List<SwissPairing> pairings = new ArrayList<>();
        for (int i = 0; i < teams.size(); i += 2) {
            if (i + 1 < teams.size()) {
                SwissPairing pairing = new SwissPairing();
                pairing.setRound(firstRound);
                pairing.setTeamA(teams.get(i));
                pairing.setTeamB(teams.get(i + 1));
                pairings.add(pairing);
            } else {
                // BYE – drużyna ma wolne (otrzymuje punkty)
                handleBye(firstRound, teams.get(i));
            }
        }
        swissPairingRepository.saveAll(pairings);
    }

    // Generowanie kolejnej rundy (algorytm szwajcarski)
    @Transactional
    public void generateNextRound(Long tournamentId) {
        // Najpierw upewnij się, że wszystkie rundy istnieją
        List<SwissRound> allRounds = swissRoundRepository.findByTournamentIdOrderByRoundNumberAsc(tournamentId);
        int totalRounds = allRounds.size();

        // Znajdź PIERWSZĄ nieukończoną rundę
        SwissRound currentRound = null;
        int currentRoundNum = 0;

        for (SwissRound round : allRounds) {
            if (!round.getIsCompleted()) {
                currentRound = round;
                currentRoundNum = round.getRoundNumber();
                break;
            }
        }

        if (currentRound == null) {
            throw new RuntimeException("Wszystkie rundy są już zakończone");
        }

        // Sprawdź czy wszystkie mecze w aktualnej rundzie są rozegrane
        List<SwissPairing> currentPairings = swissPairingRepository.findByRoundIdOrderByIdAsc(currentRound.getId());
        boolean allCompleted = currentPairings.stream().allMatch(p -> p.getWinner() != null || p.getIsDraw());

        if (!allCompleted) {
            throw new RuntimeException("Nie wszystkie mecze w rundzie " + currentRoundNum + " zostały rozegrane");
        }

        // Oznacz aktualną rundę jako zakończoną
        currentRound.setIsCompleted(true);
        swissRoundRepository.save(currentRound);

        // Znajdź następną rundę (kolejny numer)
        int nextRoundNum = currentRoundNum + 1;

        // Sprawdź czy następna runda istnieje
        SwissRound nextRound = null;
        for (SwissRound round : allRounds) {
            if (round.getRoundNumber() == nextRoundNum) {
                nextRound = round;
                break;
            }
        }

        if (nextRound == null) {
            throw new RuntimeException("Nie ma rundy " + nextRoundNum + " – to była ostatnia runda");
        }

        // Usuń stare pary w następnej rundzie (jeśli istnieją)
        List<SwissPairing> existingPairings = swissPairingRepository.findByRoundIdOrderByIdAsc(nextRound.getId());
        if (!existingPairings.isEmpty()) {
            swissPairingRepository.deleteAll(existingPairings);
        }

        // Pobierz ranking i wygeneruj nowe pary
        List<SwissStanding> standings = swissStandingRepository.findByTournamentIdOrderByPointsDescWinsDesc(tournamentId);

        // Grupuj drużyny po punktach
        Map<Integer, List<SwissStanding>> groupedByPoints = standings.stream()
                .collect(Collectors.groupingBy(SwissStanding::getPoints));

        List<SwissPairing> newPairings = new ArrayList<>();
        Set<Long> pairedTeams = new HashSet<>();
        List<SwissStanding> unpaired = new ArrayList<>();

        // Twórz pary w obrębie tej samej liczby punktów
        for (int points : groupedByPoints.keySet().stream().sorted(Collections.reverseOrder()).toList()) {
            List<SwissStanding> candidates = new ArrayList<>(groupedByPoints.get(points));
            candidates.removeIf(s -> pairedTeams.contains(s.getTeam().getId()));

            for (int i = 0; i < candidates.size(); i += 2) {
                if (i + 1 < candidates.size()) {
                    SwissStanding s1 = candidates.get(i);
                    SwissStanding s2 = candidates.get(i + 1);

                    // Sprawdź czy już ze sobą grali
                    if (!havePlayedBefore(tournamentId, s1.getTeam().getId(), s2.getTeam().getId())) {
                        SwissPairing pairing = new SwissPairing();
                        pairing.setRound(nextRound);
                        pairing.setTeamA(s1.getTeam());
                        pairing.setTeamB(s2.getTeam());
                        newPairings.add(pairing);
                        pairedTeams.add(s1.getTeam().getId());
                        pairedTeams.add(s2.getTeam().getId());
                    } else {
                        unpaired.add(s1);
                        unpaired.add(s2);
                    }
                } else {
                    unpaired.add(candidates.get(i));
                }
            }
        }

        // Dopasuj pozostałe drużyny
        for (int i = 0; i < unpaired.size(); i += 2) {
            if (i + 1 < unpaired.size()) {
                SwissPairing pairing = new SwissPairing();
                pairing.setRound(nextRound);
                pairing.setTeamA(unpaired.get(i).getTeam());
                pairing.setTeamB(unpaired.get(i + 1).getTeam());
                newPairings.add(pairing);
            } else {
                // BYE – drużyna ma wolne
                handleBye(nextRound, unpaired.get(i).getTeam());
            }
        }

        swissPairingRepository.saveAll(newPairings);
    }

    // Obsługa BYE (drużyna bez przeciwnika – dostaje punkty)
    private void handleBye(SwissRound round, Team team) {
        SwissStanding standing = swissStandingRepository.findByTournamentIdAndTeamId(
                round.getTournament().getId(), team.getId()).orElseThrow();
        standing.setPoints(standing.getPoints() + 3);
        standing.setWins(standing.getWins() + 1);
        swissStandingRepository.save(standing);

        // Oznacz rundę jako częściowo rozegraną? Opcjonalnie
    }

    // Sprawdzenie czy drużyny już grały ze sobą
    private boolean havePlayedBefore(Long tournamentId, Long teamAId, Long teamBId) {
        // Sprawdź w parach czy drużyny już ze sobą grały
        List<SwissPairing> allPairings = swissPairingRepository.findByRoundTournamentId(tournamentId);
        return allPairings.stream().anyMatch(p ->
                (p.getTeamA().getId().equals(teamAId) && p.getTeamB().getId().equals(teamBId)) ||
                        (p.getTeamA().getId().equals(teamBId) && p.getTeamB().getId().equals(teamAId))
        );
    }

    // Wprowadzenie wyniku meczu
    @Transactional
    public void updateSwissResult(Long pairingId, int scoreA, int scoreB) {
        SwissPairing pairing = swissPairingRepository.findById(pairingId).orElseThrow();

        // Aktualizuj wynik
        pairing.setResult(scoreA + ":" + scoreB);

        if (scoreA > scoreB) {
            pairing.setWinner(pairing.getTeamA());
            updateStandings(pairing.getRound().getTournament().getId(),
                    pairing.getTeamA().getId(), pairing.getTeamB().getId(), true, false);
        } else if (scoreB > scoreA) {
            pairing.setWinner(pairing.getTeamB());
            updateStandings(pairing.getRound().getTournament().getId(),
                    pairing.getTeamB().getId(), pairing.getTeamA().getId(), true, false);
        } else {
            pairing.setIsDraw(true);
            updateStandings(pairing.getRound().getTournament().getId(),
                    pairing.getTeamA().getId(), pairing.getTeamB().getId(), false, true);
        }

        swissPairingRepository.save(pairing);

        // Sprawdź czy runda jest zakończona
        checkRoundCompletion(pairing.getRound().getId());
    }

    // Aktualizacja rankingu
    private void updateStandings(Long tournamentId, Long winnerId, Long loserId, boolean win, boolean draw) {
        if (win) {
            SwissStanding winner = swissStandingRepository.findByTournamentIdAndTeamId(tournamentId, winnerId).orElseThrow();
            winner.setPoints(winner.getPoints() + 3);
            winner.setWins(winner.getWins() + 1);
            swissStandingRepository.save(winner);

            SwissStanding loser = swissStandingRepository.findByTournamentIdAndTeamId(tournamentId, loserId).orElseThrow();
            loser.setLosses(loser.getLosses() + 1);
            swissStandingRepository.save(loser);
        } else if (draw) {
            SwissStanding teamA = swissStandingRepository.findByTournamentIdAndTeamId(tournamentId, winnerId).orElseThrow();
            teamA.setPoints(teamA.getPoints() + 1);
            teamA.setDraws(teamA.getDraws() + 1);
            swissStandingRepository.save(teamA);

            SwissStanding teamB = swissStandingRepository.findByTournamentIdAndTeamId(tournamentId, loserId).orElseThrow();
            teamB.setPoints(teamB.getPoints() + 1);
            teamB.setDraws(teamB.getDraws() + 1);
            swissStandingRepository.save(teamB);
        }
    }

    // Sprawdzenie czy runda jest zakończona
    // W metodzie updateSwissResult, po zapisaniu wyniku dodaj:
    private void checkRoundCompletion(Long roundId) {
        List<SwissPairing> pairings = swissPairingRepository.findByRoundIdOrderByIdAsc(roundId);

        // Sprawdź czy wszystkie mecze w rundzie mają wynik
        boolean allCompleted = pairings.stream().allMatch(p -> p.getWinner() != null || p.getIsDraw());

        if (allCompleted) {
            // Oznacz rundę jako zakończoną
            SwissRound round = swissRoundRepository.findById(roundId).orElseThrow();
            round.setIsCompleted(true);
            swissRoundRepository.save(round);

            // Sprawdź czy to nie była ostatnia runda
            int currentRoundNumber = round.getRoundNumber();
            int totalRounds = swissRoundRepository.findByTournamentIdOrderByRoundNumberAsc(round.getTournament().getId()).size();

//            if (currentRoundNumber < totalRounds) {
//                // Automatycznie wygeneruj następną rundę
//                generateNextRound(round.getTournament().getId());
//            }
        }
    }


    // Pobierz ranking
    public List<SwissStanding> getStandings(Long tournamentId) {
        return swissStandingRepository.findByTournamentIdOrderByPointsDescWinsDesc(tournamentId);
    }

    // Pobierz pary dla konkretnej rundy
    public List<SwissPairing> getPairings(Long tournamentId, Integer roundNumber) {
        SwissRound round = swissRoundRepository.findByTournamentIdAndRoundNumber(tournamentId, roundNumber).orElseThrow();
        return swissPairingRepository.findByRoundIdOrderByIdAsc(round.getId());
    }

    @Transactional
    public void ensureRoundsExist(Long tournamentId, int numberOfRounds) {
        List<SwissRound> existingRounds = swissRoundRepository.findByTournamentIdOrderByRoundNumberAsc(tournamentId);

        // Sprawdź czy wszystkie rundy istnieją
        for (int i = 1; i <= numberOfRounds; i++) {
            int roundNum = i;
            boolean exists = existingRounds.stream().anyMatch(r -> r.getRoundNumber() == roundNum);

            if (!exists) {
                SwissRound newRound = new SwissRound();
                newRound.setTournament(tournamentRepository.findById(tournamentId).orElseThrow());
                newRound.setRoundNumber(roundNum);
                newRound.setIsCompleted(false);
                swissRoundRepository.save(newRound);
                System.out.println("Dodano brakującą rundę: " + roundNum);
            }
        }
    }
}
