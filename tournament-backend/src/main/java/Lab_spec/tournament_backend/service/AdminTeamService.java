package Lab_spec.tournament_backend.service;

import Lab_spec.tournament_backend.dto.MemberResponse;
import Lab_spec.tournament_backend.dto.TeamRequest;
import Lab_spec.tournament_backend.dto.TeamResponse;
import Lab_spec.tournament_backend.dto.UserSearchResponse;
import Lab_spec.tournament_backend.model.Team;
import Lab_spec.tournament_backend.model.TeamMember;
import Lab_spec.tournament_backend.model.User;
import Lab_spec.tournament_backend.repository.TeamMemberRepository;
import Lab_spec.tournament_backend.repository.TeamRepository;
import Lab_spec.tournament_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminTeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    public AdminTeamService(TeamRepository teamRepository,
                            UserRepository userRepository,
                            TeamMemberRepository teamMemberRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    public List<TeamResponse> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public TeamResponse getTeamById(Long id) {
        Team team = teamRepository.findByIdWithMembers(id)
                .orElseThrow(() -> new RuntimeException("Drużyna nie znaleziona"));
        return convertToResponse(team);
    }

    @Transactional
    public TeamResponse createTeam(TeamRequest request) {
        if (teamRepository.existsByName(request.getName())) {
            throw new RuntimeException("Drużyna o tej nazwie już istnieje");
        }

        User captain = findUserByEmailOrId(request.getCaptainId());

        Team team = new Team();
        team.setName(request.getName());
        team.setSport(request.getSport());
        team.setDescription(request.getDescription());
        team.setStatus(request.getStatus());
        team.setCaptain(captain);

        Team savedTeam = teamRepository.save(team);

        TeamMember captainMember = new TeamMember();
        captainMember.setTeam(savedTeam);
        captainMember.setUser(captain);
        captainMember.setRole("captain");
        teamMemberRepository.save(captainMember);

        return convertToResponse(savedTeam);
    }

    @Transactional
    public TeamResponse updateTeam(Long id, TeamRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Drużyna nie znaleziona"));

        team.setName(request.getName());
        team.setSport(request.getSport());
        team.setDescription(request.getDescription());
        team.setStatus(request.getStatus());

        if (request.getCaptainId() != null && !request.getCaptainId().isEmpty()) {
            User newCaptain = findUserByEmailOrId(request.getCaptainId());
            team.setCaptain(newCaptain);

            updateCaptainRole(team.getId(), newCaptain.getId());
        }

        Team updatedTeam = teamRepository.save(team);
        return convertToResponse(updatedTeam);
    }

    @Transactional
    public void deleteTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Drużyna nie znaleziona"));

        teamMemberRepository.deleteAll(team.getMembers());

        teamRepository.delete(team);
    }

    public List<MemberResponse> getTeamMembers(Long teamId) {
        List<TeamMember> members = teamMemberRepository.findByTeamId(teamId);
        return members.stream()
                .map(this::convertToMemberResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void addMember(Long teamId, String email) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Drużyna nie znaleziona"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Użytkownik nie znaleziony"));

        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, user.getId())) {
            throw new RuntimeException("Użytkownik już jest członkiem tej drużyny");
        }

        TeamMember member = new TeamMember();
        member.setTeam(team);
        member.setUser(user);
        member.setRole("member");

        teamMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long teamId, Long userId) {
        teamMemberRepository.deleteByTeamIdAndUserId(teamId, userId);
    }

    @Transactional
    public void changeCaptain(Long teamId, Long userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Drużyna nie znaleziona"));

        User newCaptain = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Użytkownik nie znaleziony"));

        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new RuntimeException("Użytkownik nie jest członkiem tej drużyny");
        }

        updateCaptainRole(teamId, null);

        team.setCaptain(newCaptain);
        teamRepository.save(team);

        updateCaptainRole(teamId, userId);
    }

    public UserSearchResponse searchUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Użytkownik nie znaleziony"));

        UserSearchResponse response = new UserSearchResponse();
        response.setId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());

        return response;
    }


    private User findUserByEmailOrId(String captainId) {
        if (captainId.contains("@")) {
            return userRepository.findByEmail(captainId)
                    .orElseThrow(() -> new RuntimeException("Użytkownik nie znaleziony"));
        } else {
            try {
                Long id = Long.parseLong(captainId);
                return userRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Użytkownik nie znaleziony"));
            } catch (NumberFormatException e) {
                throw new RuntimeException("Nieprawidłowy format ID kapitana");
            }
        }
    }

    private void updateCaptainRole(Long teamId, Long captainUserId) {
        List<TeamMember> members = teamMemberRepository.findByTeamId(teamId);
        for (TeamMember member : members) {
            if (captainUserId != null && member.getUser().getId().equals(captainUserId)) {
                member.setRole("captain");
            } else {
                member.setRole("member");
            }
            teamMemberRepository.save(member);
        }
    }

    private TeamResponse convertToResponse(Team team) {
        TeamResponse response = new TeamResponse();
        response.setId(team.getId());
        response.setName(team.getName());
        response.setSport(team.getSport());
        response.setDescription(team.getDescription());
        response.setStatus(team.getStatus());

        if (team.getCaptain() != null) {
            response.setCaptainId(team.getCaptain().getId());
            response.setCaptainName(team.getCaptain().getFirstName() + " " + team.getCaptain().getLastName());
            response.setCaptainEmail(team.getCaptain().getEmail());
        }

        response.setMembersCount(team.getMembers().size());

        List<MemberResponse> members = team.getMembers().stream()
                .map(this::convertToMemberResponse)
                .collect(Collectors.toList());
        response.setMembers(members);

        return response;
    }

    private MemberResponse convertToMemberResponse(TeamMember teamMember) {
        MemberResponse response = new MemberResponse();
        User user = teamMember.getUser();
        response.setId(user.getId());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        response.setRole(teamMember.getRole());
        return response;
    }
}
