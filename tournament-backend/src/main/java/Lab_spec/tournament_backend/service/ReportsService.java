package Lab_spec.tournament_backend.service;

import Lab_spec.tournament_backend.model.*;
import Lab_spec.tournament_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportsService {

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getGlobalSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalTournaments", tournamentRepository.count());
        summary.put("totalTeams", teamRepository.count());
        summary.put("totalPlayers", userRepository.count());

        // Rozkład dyscyplin do wykresu kołowego
        List<Map<String, Object>> disciplineDist = tournamentRepository.findAll().stream()
                .collect(Collectors.groupingBy(Tournament::getDiscipline, Collectors.counting()))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", e.getKey());
                    m.put("value", e.getValue());
                    return m;
                }).collect(Collectors.toList());

        summary.put("disciplineDistribution", disciplineDist);
        return summary;
    }

    public Map<String, Object> getTeamStats(Long teamId) {
        List<Match> teamMatches = matchRepository.findAll().stream()
                .filter(m -> m.getStatus().equals("completed"))
                .filter(m -> (m.getTeamA() != null && m.getTeamA().getId().equals(teamId)) ||
                        (m.getTeamB() != null && m.getTeamB().getId().equals(teamId)))
                .toList();

        long wins = teamMatches.stream().filter(m -> m.getWinner() != null && m.getWinner().getId().equals(teamId)).count();
        long total = teamMatches.size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMatches", total);
        stats.put("wins", wins);
        stats.put("winRatio", total > 0 ? (double) wins / total * 100 : 0);
        return stats;
    }
}