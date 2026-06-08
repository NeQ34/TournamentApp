package Lab_spec.tournament_backend.repository;

import Lab_spec.tournament_backend.model.SwissRound;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SwissRoundRepository extends JpaRepository<SwissRound, Long> {
    List<SwissRound> findByTournamentIdOrderByRoundNumberAsc(Long tournamentId);
    Optional<SwissRound> findByTournamentIdAndRoundNumber(Long tournamentId, Integer roundNumber);

    @Modifying
    @Transactional
    @Query("DELETE FROM SwissRound r WHERE r.tournament.id = :tournamentId")
    void deleteByTournamentId(@Param("tournamentId") Long tournamentId);
}
