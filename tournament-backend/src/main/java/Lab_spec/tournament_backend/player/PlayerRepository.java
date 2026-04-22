package Lab_spec.tournament_backend.player;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    // Pozwala adminowi widzieć tylko "swoich" dodanych zawodników
    List<Player> findByCreatedByEmail(String email);
}