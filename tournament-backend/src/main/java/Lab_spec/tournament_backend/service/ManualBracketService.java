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
public class ManualBracketService {

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    public ManualBracketService(TournamentRepository tournamentRepository,
                                TeamRepository teamRepository,
                                MatchRepository matchRepository) {
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
        this.matchRepository = matchRepository;
    }

    @Transactional
    public void enableManualMode(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        // Usuń istniejące mecze jeśli są
        matchRepository.deleteByTournamentId(tournamentId);

        tournament.setBracketType("manual");
        tournamentRepository.save(tournament);
    }

    public List<Team> getAvailableTeams(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        List<Team> allTeams = tournament.getTeams();

        // Pobierz ID drużyn które już grają w jakimś meczu
        List<Match> existingMatches = matchRepository.findByTournamentIdOrderByRoundNumberAscMatchOrderAsc(tournamentId);
        Set<Long> teamsInMatches = new HashSet<>();

        for (Match match : existingMatches) {
            if (match.getTeamA() != null) teamsInMatches.add(match.getTeamA().getId());
            if (match.getTeamB() != null) teamsInMatches.add(match.getTeamB().getId());
        }

        // Zwróć tylko drużyny nieprzypisane do żadnego meczu
        return allTeams.stream()
                .filter(team -> !teamsInMatches.contains(team.getId()))
                .collect(Collectors.toList());
    }

    public List<Match> getAllMatches(Long tournamentId) {
        return matchRepository.findByTournamentIdOrderByRoundNumberAscMatchOrderAsc(tournamentId);
    }

    public Map<Integer, List<Match>> getMatchesByRound(Long tournamentId) {
        List<Match> matches = getAllMatches(tournamentId);
        Map<Integer, List<Match>> grouped = new HashMap<>();

        for (Match match : matches) {
            grouped.computeIfAbsent(match.getRoundNumber(), k -> new ArrayList<>()).add(match);
        }

        // Sortuj mecze w każdej rundzie
        for (List<Match> roundMatches : grouped.values()) {
            roundMatches.sort(Comparator.comparing(Match::getMatchOrder));
        }

        return grouped;
    }

    @Transactional
    public Match createMatch(Long tournamentId, Long teamAId, Long teamBId,
                             Integer roundNumber, LocalDateTime scheduledTime, Integer courtNumber) {

        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        Team teamA = teamRepository.findById(teamAId)
                .orElseThrow(() -> new RuntimeException("Drużyna A nie znaleziona"));
        Team teamB = teamRepository.findById(teamBId)
                .orElseThrow(() -> new RuntimeException("Drużyna B nie znaleziona"));

        // Walidacja: czy drużyny są w turnieju
        if (!tournament.getTeams().contains(teamA) || !tournament.getTeams().contains(teamB)) {
            throw new RuntimeException("Jedna z drużyn nie należy do tego turnieju");
        }

        // Walidacja: czy drużyny już grają w tej rundzie
        List<Match> existingMatches = matchRepository.findByTournamentIdAndRoundNumberOrderByMatchOrder(
                tournamentId, roundNumber);

        for (Match match : existingMatches) {
            if ((match.getTeamA() != null && match.getTeamA().getId().equals(teamAId)) ||
                    (match.getTeamB() != null && match.getTeamB().getId().equals(teamAId))) {
                throw new RuntimeException("Drużyna A już gra w meczu w tej rundzie");
            }
            if ((match.getTeamA() != null && match.getTeamA().getId().equals(teamBId)) ||
                    (match.getTeamB() != null && match.getTeamB().getId().equals(teamBId))) {
                throw new RuntimeException("Drużyna B już gra w meczu w tej rundzie");
            }
        }

        // Walidacja: drużyny nie mogą grać same ze sobą
        if (teamAId.equals(teamBId)) {
            throw new RuntimeException("Drużyna nie może grać sama ze sobą");
        }

        Match match = new Match();
        match.setTournament(tournament);
        match.setTeamA(teamA);
        match.setTeamB(teamB);
        match.setRoundNumber(roundNumber);
        match.setMatchOrder(existingMatches.size());
        match.setStatus("pending");
        match.setScheduledTime(scheduledTime);
        match.setCourtNumber(courtNumber);

        return matchRepository.save(match);
    }

    @Transactional
    public Match updateMatch(Long matchId, Long teamAId, Long teamBId, String result,
                             Long winnerId, LocalDateTime scheduledTime, Integer courtNumber,
                             Integer roundNumber, String notes) {

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Mecz nie znaleziony"));

        // Aktualizuj drużyny jeśli podane
        if (teamAId != null) {
            Team teamA = teamRepository.findById(teamAId)
                    .orElseThrow(() -> new RuntimeException("Drużyna A nie znaleziona"));
            match.setTeamA(teamA);
        }
        if (teamBId != null) {
            Team teamB = teamRepository.findById(teamBId)
                    .orElseThrow(() -> new RuntimeException("Drużyna B nie znaleziona"));
            match.setTeamB(teamB);
        }

        // Aktualizuj wynik
        if (result != null && !result.trim().isEmpty()) {
            match.setResult(result);
            match.setStatus("completed");

            if (winnerId != null) {
                Team winner = teamRepository.findById(winnerId)
                        .orElseThrow(() -> new RuntimeException("Zwycięzca nie znaleziony"));
                match.setWinner(winner);
            }
        }

        // Aktualizuj pozostałe pola
        if (scheduledTime != null) match.setScheduledTime(scheduledTime);
        if (courtNumber != null) match.setCourtNumber(courtNumber);
        if (roundNumber != null) match.setRoundNumber(roundNumber);
        if (notes != null) match.setNotes(notes);

        return matchRepository.save(match);
    }

    @Transactional
    public void deleteMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Mecz nie znaleziony"));
        matchRepository.delete(match);
    }

    public List<Team> getWinnersFromRound(Long tournamentId, Integer roundNumber) {
        List<Match> matches = matchRepository.findByTournamentIdAndRoundNumberOrderByMatchOrder(tournamentId, roundNumber);
        List<Team> winners = new ArrayList<>();

        for (Match match : matches) {
            if (match.getWinner() != null) {
                winners.add(match.getWinner());
            }
        }

        return winners;
    }
}