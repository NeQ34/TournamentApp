package Lab_spec.tournament_backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class TeamResponse {
    private Long id;
    private String name;
    private String sport;
    private String description;
    private String status;
    private Long captainId;
    private String captainName;
    private String captainEmail;
    private Integer membersCount;
    private List<MemberResponse> members;
}
