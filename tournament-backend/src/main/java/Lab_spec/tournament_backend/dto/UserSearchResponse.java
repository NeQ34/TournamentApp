package Lab_spec.tournament_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSearchResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
}
