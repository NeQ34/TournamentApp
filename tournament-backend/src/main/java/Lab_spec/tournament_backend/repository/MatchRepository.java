package Lab_spec.tournament_backend.repository;

import Lab_spec.tournament_backend.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByTournamentIdOrderByRoundNumberAscMatchOrderAsc(Long tournamentId);
    void deleteByTournamentId(Long tournamentId);

    List<Match> findByRoundNumberOrderByMatchOrder(Integer roundNumber);

    List<Match> findByTournamentIdAndRoundNumberOrderByMatchOrder(Long tournamentId, Integer roundNumber);

    List<Match> findByNextMatchId(Long nextMatchId);
}