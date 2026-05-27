package Lab_spec.tournament_backend.service;

import Lab_spec.tournament_backend.model.Match;
import Lab_spec.tournament_backend.model.Team;
import Lab_spec.tournament_backend.model.Tournament;
import Lab_spec.tournament_backend.repository.MatchRepository;
import Lab_spec.tournament_backend.repository.TeamRepository;
import Lab_spec.tournament_backend.repository.TournamentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BracketService {

    private final MatchRepository matchRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;

    private static final int DEFAULT_MATCH_DURATION = 90;
    private static final int BREAK_BETWEEN_MATCHES = 15;
    private static final int BREAK_BETWEEN_ROUNDS = 30;

    private static final int BREAK_BETWEEN_MATCHES_SAME_COURT = 15;

    public BracketService(MatchRepository matchRepository,
                          TournamentRepository tournamentRepository,
                          TeamRepository teamRepository) {
        this.matchRepository = matchRepository;
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
    }

    @Transactional
    public void generateBracket(Long tournamentId, boolean randomize, int numberOfCourts) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        List<Team> teams = new ArrayList<>(tournament.getTeams());

        if (teams.size() < 2) {
            throw new RuntimeException("Za mało drużyn do wygenerowania drabinki (minimum 2)");
        }

        // Usuń stare mecze
        matchRepository.deleteByTournamentId(tournamentId);

        // Losowanie lub zachowanie kolejności
        if (randomize) {
            Collections.shuffle(teams);
        }

        // Uzupełnienie do potęgi dwójki (BYE)
        int size = teams.size();
        int nextPowerOfTwo = 1;
        while (nextPowerOfTwo < size) {
            nextPowerOfTwo <<= 1;
        }

        List<Team> allTeams = new ArrayList<>(teams);
        for (int i = size; i < nextPowerOfTwo; i++) {
            allTeams.add(null);
        }

        // Lista wszystkich meczów do zapisania
        List<Match> allMatches = new ArrayList<>();
        List<Match> currentRound = new ArrayList<>();
        int matchCounter = 1;

        // I runda – mecze z drużynami
        for (int i = 0; i < allTeams.size(); i += 2) {
            Match match = new Match();
            match.setTournament(tournament);
            match.setTeamA(allTeams.get(i));
            match.setTeamB(allTeams.get(i + 1));
            match.setRoundNumber(1);
            match.setMatchOrder(currentRound.size());
            match.setStatus("pending");
            match.setMatchNumber(matchCounter++);
            currentRound.add(match);
        }
        allMatches.addAll(currentRound);

        // Kolejne rundy – tylko puste mecze
        int round = 2;
        while (currentRound.size() > 1) {
            List<Match> nextRound = new ArrayList<>();
            int matchesInNextRound = currentRound.size() / 2;
            for (int i = 0; i < matchesInNextRound; i++) {
                Match match = new Match();
                match.setTournament(tournament);
                match.setRoundNumber(round);
                match.setMatchOrder(i);
                match.setStatus("pending");
                match.setMatchNumber(matchCounter++);
                nextRound.add(match);
            }
            allMatches.addAll(nextRound);
            currentRound = nextRound;
            round++;
        }

        // Zapisz wszystkie mecze
        allMatches = matchRepository.saveAll(allMatches);

        // Teraz ustaw nextMatchId – łączymy mecze między rundami
        // Indeksy w allMatches są w kolejności: runda 1, runda 2, runda 3...
        int matchesPerRound = allTeams.size() / 2;
        int startIndex = 0;

        for (int r = 1; r < round; r++) {
            int currentRoundMatches = matchesPerRound;
            int nextRoundMatches = matchesPerRound / 2;

            if (nextRoundMatches == 0) break;

            int currentStart = startIndex;
            int nextStart = startIndex + currentRoundMatches;

            for (int i = 0; i < nextRoundMatches; i++) {
                Match nextMatch = allMatches.get(nextStart + i);

                // Pierwszy mecz źródłowy (lewa strona)
                Match sourceMatch1 = allMatches.get(currentStart + i * 2);
                sourceMatch1.setNextMatchId(nextMatch.getId());

                // Drugi mecz źródłowy (prawa strona) – jeśli istnieje
                if (i * 2 + 1 < currentRoundMatches) {
                    Match sourceMatch2 = allMatches.get(currentStart + i * 2 + 1);
                    sourceMatch2.setNextMatchId(nextMatch.getId());
                }
            }

            startIndex += currentRoundMatches;
            matchesPerRound = nextRoundMatches;
        }

        // Zapisz zaktualizowane nextMatchId
        matchRepository.saveAll(allMatches);

        // Automatyczne rozstrzygnięcie meczów BYE (gdzie drużyna A lub B jest null)
        for (Match match : allMatches) {
            if (match.getTeamA() == null && match.getTeamB() != null) {
                match.setWinner(match.getTeamB());
                match.setResult("BYE");
                match.setStatus("completed");
            } else if (match.getTeamB() == null && match.getTeamA() != null) {
                match.setWinner(match.getTeamA());
                match.setResult("BYE");
                match.setStatus("completed");
            }
        }

        // Po wygenerowaniu drabinki i ustawieniu nextMatchId, dodaj:
        LocalDateTime startTime = tournament.getStartDate() != null
                ? tournament.getStartDate().atTime(10, 0)
                : LocalDateTime.now().withHour(10).withMinute(0);

        // Przelicz godziny od pierwszego meczu
        if (!allMatches.isEmpty()) {
            Match firstMatch = allMatches.stream()
                    .filter(m -> m.getRoundNumber() == 1 && m.getMatchOrder() == 0)
                    .findFirst()
                    .orElse(allMatches.get(0));

            recalculateTimesWithCourts(firstMatch.getId(), startTime, numberOfCourts);
        }

        matchRepository.saveAll(allMatches);
    }

    private void recalculateTimesWithCourts(Long startMatchId, LocalDateTime startTime, int numberOfCourts) {
        Match firstMatch = matchRepository.findById(startMatchId).orElse(null);
        if (firstMatch == null) return;

        Long tournamentId = firstMatch.getTournament().getId();

        // Grupuj mecze według rund
        List<Integer> rounds = matchRepository.findByTournamentIdOrderByRoundNumberAscMatchOrderAsc(tournamentId)
                .stream()
                .map(Match::getRoundNumber)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        LocalDateTime currentTime = startTime;
        int court = 1;

        for (int round : rounds) {
            List<Match> matchesInRound = matchRepository.findByTournamentIdAndRoundNumberOrderByMatchOrder(tournamentId, round);

            // Przypisz czasy i boiska dla meczów w rundzie
            int matchIndex = 0;
            while (matchIndex < matchesInRound.size()) {
                for (int c = 1; c <= numberOfCourts && matchIndex < matchesInRound.size(); c++) {
                    Match match = matchesInRound.get(matchIndex);
                    match.setScheduledTime(currentTime);
                    match.setCourtNumber(c);
                    matchRepository.save(match);
                    matchIndex++;
                }
                // Przejdź do następnego slotu czasowego
                if (matchIndex < matchesInRound.size()) {
                    currentTime = currentTime.plusMinutes(DEFAULT_MATCH_DURATION + BREAK_BETWEEN_MATCHES_SAME_COURT);
                }
            }

            // Przerwa między rundami
            if (round < rounds.get(rounds.size() - 1)) {
                currentTime = currentTime.plusMinutes(BREAK_BETWEEN_ROUNDS);
            }
        }
    }

    public List<Match> getBracket(Long tournamentId) {
        return matchRepository.findByTournamentIdOrderByRoundNumberAscMatchOrderAsc(tournamentId);
    }

    @Transactional
    public void updateMatchResult(Long matchId, String result, Long winnerId, String notes) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Mecz nie znaleziony"));

        Team winner = teamRepository.findById(winnerId)
                .orElseThrow(() -> new RuntimeException("Drużyna nie znaleziona"));

        // ZAPAMIĘTAJ poprzedniego zwycięzcę
        Team oldWinner = match.getWinner();

        match.setResult(result);
        match.setStatus("completed");
        match.setWinner(winner);

        if (notes != null && !notes.trim().isEmpty()) {
            match.setNotes(notes);
        }

        matchRepository.save(match);

        // Przejście do następnego meczu
        if (match.getNextMatchId() != null) {
            Match nextMatch = matchRepository.findById(match.getNextMatchId())
                    .orElseThrow(() -> new RuntimeException("Następny mecz nie znaleziony"));

            // USUŃ starego zwycięzcę z obu miejsc w następnym meczu
            if (oldWinner != null) {
                if (nextMatch.getTeamA() != null && nextMatch.getTeamA().getId().equals(oldWinner.getId())) {
                    nextMatch.setTeamA(null);
                }
                if (nextMatch.getTeamB() != null && nextMatch.getTeamB().getId().equals(oldWinner.getId())) {
                    nextMatch.setTeamB(null);
                }
            }

            // Znajdź wolne miejsce i ustaw nowego zwycięzcę
            // WAŻNE: sprawdź czy nowy zwycięzca nie jest już w drugim miejscu
            boolean isWinnerAlreadyInMatch = false;

            if (nextMatch.getTeamA() != null && nextMatch.getTeamA().getId().equals(winner.getId())) {
                isWinnerAlreadyInMatch = true;
            }
            if (nextMatch.getTeamB() != null && nextMatch.getTeamB().getId().equals(winner.getId())) {
                isWinnerAlreadyInMatch = true;
            }

            if (!isWinnerAlreadyInMatch) {
                // Znajdź pierwsze wolne miejsce
                if (nextMatch.getTeamA() == null) {
                    nextMatch.setTeamA(winner);
                } else if (nextMatch.getTeamB() == null) {
                    nextMatch.setTeamB(winner);
                }
            }

            // Jeśli oba miejsca są puste, ustaw w teamA
            if (nextMatch.getTeamA() == null && nextMatch.getTeamB() == null) {
                nextMatch.setTeamA(winner);
            }

            matchRepository.save(nextMatch);

            // DODATKOWO: sprawdź czy ten sam mecz nie ma dwóch identycznych drużyn
            if (nextMatch.getTeamA() != null && nextMatch.getTeamB() != null &&
                    nextMatch.getTeamA().getId().equals(nextMatch.getTeamB().getId())) {

                // Wyczyść drugie miejsce
                nextMatch.setTeamB(null);
                matchRepository.save(nextMatch);
            }
        }
    }

    @Transactional
    public void updateMatchTime(Long matchId, String scheduledTimeStr) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Mecz nie znaleziony"));

        LocalDateTime newTime = LocalDateTime.parse(scheduledTimeStr);
        LocalDateTime oldTime = match.getScheduledTime();

        match.setScheduledTime(newTime);
        matchRepository.save(match);

        // Przelicz godziny dla wszystkich meczów po tym meczu
        if (match.getNextMatchId() != null) {
            recalculateTimes(match.getNextMatchId(),
                    newTime.plusMinutes(calculateMatchDuration(match)));
        }
    }

    private void recalculateTimes(Long startMatchId, LocalDateTime startTime) {
        Match current = matchRepository.findById(startMatchId).orElse(null);
        if (current == null) return;

        Long tournamentId = current.getTournament().getId();
        LocalDateTime time = startTime;

        while (current != null) {
            current.setScheduledTime(time);
            matchRepository.save(current);

            // Pobierz wszystkie mecze w tej samej rundzie i turnieju
            List<Match> sameRound = matchRepository.findByTournamentIdAndRoundNumberOrderByMatchOrder(
                    tournamentId,
                    current.getRoundNumber()
            );

            int currentIndex = sameRound.indexOf(current);

            if (currentIndex + 1 < sameRound.size()) {
                // Następny mecz w tej samej rundzie
                current = sameRound.get(currentIndex + 1);
                time = time.plusMinutes(calculateMatchDuration(current) + BREAK_BETWEEN_MATCHES);
            } else {
                // Koniec rundy – przejdź do następnej rundy
                Long nextMatchId = current.getNextMatchId();
                current = nextMatchId != null ? matchRepository.findById(nextMatchId).orElse(null) : null;
                if (current != null) {
                    time = time.plusMinutes(BREAK_BETWEEN_ROUNDS);
                }
            }
        }
    }

    private int calculateMatchDuration(Match match) {
        return DEFAULT_MATCH_DURATION;
    }
}