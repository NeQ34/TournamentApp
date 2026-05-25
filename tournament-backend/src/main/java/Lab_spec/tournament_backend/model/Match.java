package Lab_spec.tournament_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne
    @JoinColumn(name = "team_a_id")
    private Team teamA;

    @ManyToOne
    @JoinColumn(name = "team_b_id")
    private Team teamB;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private Team winner;

    @Column(name = "round_number", nullable = false)
    private Integer roundNumber;

    @Column(name = "match_order", nullable = false)
    private Integer matchOrder;

    private String result;
    private String status = "pending";  // pending, completed

    @Column(name = "match_number")
    private Integer matchNumber;

    @Column(name = "source_match_a_id")
    private Long sourceMatchAId;

    @Column(name = "source_match_b_id")
    private Long sourceMatchBId;

    @Column(name = "next_match_id")
    private Long nextMatchId;   // ID meczu, do którego przechodzi zwycięzca

    @Column(length = 2000)
    private String notes;
}