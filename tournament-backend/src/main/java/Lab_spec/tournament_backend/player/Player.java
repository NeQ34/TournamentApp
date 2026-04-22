package Lab_spec.tournament_backend.player;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "players") // nazwa tabeli, którą stworzyliśmy w pgAdmin
@Data // adnotacja Lombok, która wygeneruje gettery i settery
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private String nickname;

    private LocalDate birthDate;

    private String position;

    // To pole pozwoli nam odfiltrować zawodników danego kapitana
    private String createdByEmail;
}