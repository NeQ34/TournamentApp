
package Lab_spec.tournament_backend.service;

import Lab_spec.tournament_backend.dto.TournamentRequest;
import Lab_spec.tournament_backend.dto.TournamentResponse;
import Lab_spec.tournament_backend.model.Discipline;
import Lab_spec.tournament_backend.model.Team;
import Lab_spec.tournament_backend.model.Tournament;
import Lab_spec.tournament_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.time.LocalDate;

@Service
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final DisciplineRepository disciplineRepository;
    private final TournamentTeamRepository tournamentTeamRepository;
    private final DisciplineService disciplineService;
    private final MatchRepository matchRepository;

    public TournamentService(TournamentRepository tournamentRepository,
                             TeamRepository teamRepository,
                             DisciplineRepository disciplineRepository,
                             TournamentTeamRepository tournamentTeamRepository,
                             DisciplineService disciplineService,
                             MatchRepository matchRepository) {
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
        this.disciplineRepository = disciplineRepository;
        this.tournamentTeamRepository = tournamentTeamRepository;
        this.disciplineService = disciplineService;
        this.matchRepository = matchRepository;
    }

    // Pobierz wszystkie turnieje
    public List<TournamentResponse> getAllTournaments() {
        return tournamentRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Pobierz turniej po ID
    public TournamentResponse getTournamentById(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));
        return convertToResponse(tournament);
    }

    // Utwórz turniej
    @Transactional
    public TournamentResponse createTournament(TournamentRequest request) {
        // Walidacja nazwy
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Nazwa turnieju jest wymagana");
        }

        // Walidacja dyscypliny
        if (request.getDiscipline() == null || request.getDiscipline().trim().isEmpty()) {
            throw new RuntimeException("Dyscyplina jest wymagana");
        }

        // Automatyczne dodanie dyscypliny jeśli nie istnieje
        String disciplineName = disciplineService.getOrCreateDisciplineName(request.getDiscipline());

        // Walidacja dat
        if (request.getStartDate() == null) {
            throw new RuntimeException("Data rozpoczęcia jest wymagana");
        }

        if (request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new RuntimeException("Data zakończenia nie może być wcześniejsza niż data rozpoczęcia");
        }

        Tournament tournament = new Tournament();
        tournament.setName(request.getName().trim());
        tournament.setDiscipline(disciplineName);
        tournament.setStartDate(request.getStartDate());
        tournament.setEndDate(request.getEndDate());
        tournament.setLocation(request.getLocation());
        tournament.setDescription(request.getDescription());
        tournament.setStatus(request.getStatus() != null ? request.getStatus() : "planned");
        tournament.setMaxTeams(request.getMaxTeams());

        Tournament savedTournament = tournamentRepository.save(tournament);
        return convertToResponse(savedTournament);
    }

    // Edytuj turniej
    @Transactional
    public TournamentResponse updateTournament(Long id, TournamentRequest request) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            tournament.setName(request.getName().trim());
        }

        if (request.getDiscipline() != null && !request.getDiscipline().trim().isEmpty()) {
            String disciplineName = disciplineService.getOrCreateDisciplineName(request.getDiscipline());
            tournament.setDiscipline(disciplineName);
        }

        if (request.getStartDate() != null) {
            tournament.setStartDate(request.getStartDate());
        }

        if (request.getEndDate() != null) {
            tournament.setEndDate(request.getEndDate());
        }

        if (request.getLocation() != null) {
            tournament.setLocation(request.getLocation());
        }

        if (request.getDescription() != null) {
            tournament.setDescription(request.getDescription());
        }

        if (request.getStatus() != null) {
            tournament.setStatus(request.getStatus());
        }

        if (request.getMaxTeams() != null) {
            tournament.setMaxTeams(request.getMaxTeams());
        }

        Tournament updatedTournament = tournamentRepository.save(tournament);
        return convertToResponse(updatedTournament);
    }

    // Usuń turniej
    @Transactional
    public void deleteTournament(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        // Najpierw usuń wszystkie mecze powiązane z turniejem
        matchRepository.deleteByTournamentId(id);

        // Potem usuń turniej
        tournamentRepository.delete(tournament);
    }

    // Pobierz dostępne drużyny (aktywne, w danej dyscyplinie, niezgłoszone do turnieju)
    public List<Team> getAvailableTeams(Long tournamentId, String discipline) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        // Pobierz ID drużyn już zgłoszonych
        Set<Long> registeredTeamIds = tournament.getTeams().stream()
                .map(Team::getId)
                .collect(Collectors.toSet());

        // Pobierz wszystkie aktywne drużyny w danej dyscyplinie
        List<Team> allActiveTeams = teamRepository.findByStatusAndSport("active", discipline);

        // Odfiltruj te, które są już zgłoszone
        return allActiveTeams.stream()
                .filter(team -> !registeredTeamIds.contains(team.getId()))
                .collect(Collectors.toList());
    }

    // Pobierz zgłoszone drużyny
    public List<Team> getRegisteredTeams(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));
        return tournament.getTeams();
    }

    // Dodaj drużynę do turnieju
    @Transactional
    public void addTeamToTournament(Long tournamentId, Long teamId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Drużyna nie znaleziona"));

        // Sprawdź czy drużyna ma odpowiednią dyscyplinę
        if (!team.getSport().equalsIgnoreCase(tournament.getDiscipline())) {
            throw new RuntimeException("Drużyna nie należy do dyscypliny tego turnieju");
        }

        // Sprawdź czy drużyna jest już zgłoszona
        if (tournament.getTeams().contains(team)) {
            throw new RuntimeException("Drużyna jest już zgłoszona do tego turnieju");
        }

        // Sprawdź limit drużyn
        if (tournament.getMaxTeams() != null && tournament.getTeams().size() >= tournament.getMaxTeams()) {
            throw new RuntimeException("Osiągnięto limit drużyn w tym turnieju");
        }

        tournament.getTeams().add(team);
        tournamentRepository.save(tournament);
    }

    // Usuń drużynę z turnieju
    @Transactional
    public void removeTeamFromTournament(Long tournamentId, Long teamId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Drużyna nie znaleziona"));

        if (!tournament.getTeams().contains(team)) {
            throw new RuntimeException("Drużyna nie jest zgłoszona do tego turnieju");
        }

        tournament.getTeams().remove(team);
        tournamentRepository.save(tournament);
    }

    // Metoda pomocnicza do konwersji
    private TournamentResponse convertToResponse(Tournament tournament) {
        TournamentResponse response = new TournamentResponse();
        response.setId(tournament.getId());
        response.setName(tournament.getName());
        response.setDiscipline(tournament.getDiscipline());
        response.setStartDate(tournament.getStartDate());
        response.setEndDate(tournament.getEndDate());
        response.setLocation(tournament.getLocation());
        response.setDescription(tournament.getDescription());
        response.setStatus(calculateTournamentStatus(tournament));
        response.setMaxTeams(tournament.getMaxTeams());
        response.setRegisteredTeamsCount(tournament.getTeams() != null ? tournament.getTeams().size() : 0);
        return response;
    }

    private String calculateTournamentStatus(Tournament tournament) {
        if ("archived".equalsIgnoreCase(tournament.getStatus())) {
            return "archived";
        }

        LocalDate today = LocalDate.now();
        if (tournament.getStartDate() == null) {
            return "planned";
        }
        if (today.isBefore(tournament.getStartDate())) {
            return "planned";
        }
        if (tournament.getEndDate() != null && today.isAfter(tournament.getEndDate())) {
            return "finished";
        }
        return "ongoing";
    }
}