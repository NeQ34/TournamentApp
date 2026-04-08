package Lab_spec.tournament_backend.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private LocalDate birthDate;

    @Column(unique = true)
    private String email;

    private String password;

    private Boolean wantsAdmin;

    private String role; // USER, ADMIN, SUPERADMIN


}
