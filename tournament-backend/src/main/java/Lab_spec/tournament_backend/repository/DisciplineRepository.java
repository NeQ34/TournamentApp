package Lab_spec.tournament_backend.repository;

import Lab_spec.tournament_backend.model.Discipline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DisciplineRepository extends JpaRepository<Discipline, Long> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Discipline> findByNameIgnoreCase(String name);
}