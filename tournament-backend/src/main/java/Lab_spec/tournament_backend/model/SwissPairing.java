package Lab_spec.tournament_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "swiss_pairings")
public class SwissPairing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "round_id", nullable = false)
    private SwissRound round;

    @ManyToOne
    @JoinColumn(name = "team_a_id", nullable = false)
    private Team teamA;

    @ManyToOne
    @JoinColumn(name = "team_b_id", nullable = false)
    private Team teamB;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private Team winner;

    private String result;

    @Column(name = "is_draw")
    private Boolean isDraw = false;

    @Column(name = "court_number")
    private Integer courtNumber;

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;
}
