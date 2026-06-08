package Lab_spec.tournament_backend.repository;

import Lab_spec.tournament_backend.model.SwissPairing;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SwissPairingRepository extends JpaRepository<SwissPairing, Long> {
    List<SwissPairing> findByRoundIdOrderByIdAsc(Long roundId);
    List<SwissPairing> findByRoundTournamentId(Long tournamentId);
    boolean existsByRoundTournamentIdAndTeamAIdOrTeamBId(Long tournamentId, Long teamAId, Long teamBId);

    @Modifying
    @Transactional
    @Query("DELETE FROM SwissPairing p WHERE p.round.tournament.id = :tournamentId")
    void deleteByRoundTournamentId(@Param("tournamentId") Long tournamentId);

    @Query("SELECT COUNT(p) > 0 FROM SwissPairing p WHERE p.round.tournament.id = :tournamentId AND (p.teamA.id = :teamAId OR p.teamB.id = :teamAId) AND (p.teamA.id = :teamBId OR p.teamB.id = :teamBId)")
    boolean existsByRoundTournamentIdAndTeams(@Param("tournamentId") Long tournamentId,
                                              @Param("teamAId") Long teamAId,
                                              @Param("teamBId") Long teamBId);
}
