package Lab_spec.tournament_backend.repository;

import Lab_spec.tournament_backend.model.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {

    List<Tournament> findByStatus(String status);

    List<Tournament> findByDiscipline(String discipline);

    @Query("SELECT COUNT(t) FROM Tournament t WHERE t.discipline = :discipline")
    Long countByDiscipline(@Param("discipline") String discipline);
}