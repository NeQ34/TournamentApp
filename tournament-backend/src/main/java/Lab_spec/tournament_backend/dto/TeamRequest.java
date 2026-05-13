package Lab_spec.tournament_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamRequest {

    @NotBlank(message = "Nazwa drużyny jest wymagana")
    private String name;

    @NotBlank(message = "Dyscyplina jest wymagana")
    private String sport;

    private String captainId;

    private String description;

    private String status = "active";
}
