package Lab_spec.tournament_backend.service;

import Lab_spec.tournament_backend.model.Discipline;
import Lab_spec.tournament_backend.repository.DisciplineRepository;
import Lab_spec.tournament_backend.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.apache.commons.text.similarity.LevenshteinDistance;
import Lab_spec.tournament_backend.repository.TeamMemberRepository;

import java.util.List;

@Service
public class DisciplineService {

    private final DisciplineRepository disciplineRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    public DisciplineService(
            DisciplineRepository disciplineRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository
    ) {
        this.disciplineRepository = disciplineRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    public List<Discipline> getAllDisciplines() {
        return disciplineRepository.findAll();
    }

    public Discipline addDiscipline(String name, Integer minMembers, Integer maxMembers) {

        validateMemberLimits(minMembers, maxMembers);

        String normalizedName = name.trim();

        if (disciplineRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new RuntimeException("Taka dyscyplina już istnieje.");
        }

        Discipline discipline = new Discipline();
        discipline.setName(normalizedName);

        discipline.setMinMembers(minMembers);
        discipline.setMaxMembers(maxMembers);

        return disciplineRepository.save(discipline);
    }

    public Discipline updateDiscipline(Long id, String newName, Integer minMembers, Integer maxMembers) {

        Discipline discipline = disciplineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nie znaleziono dyscypliny."));

        validateMemberLimits(minMembers, maxMembers);

        Integer currentMaxMembers = teamMemberRepository.findMaxMembersCountBySport(discipline.getName());

        if (currentMaxMembers != null && currentMaxMembers > maxMembers) {
            throw new RuntimeException(
                    "Nie można ustawić takiego maksimum. Istnieje drużyna w tej dyscyplinie z liczbą członków: "
                            + currentMaxMembers + "."
            );
        }

        String normalizedName = newName.trim();

        disciplineRepository.findByNameIgnoreCase(normalizedName)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new RuntimeException("Taka dyscyplina już istnieje.");
                    }
                });

        discipline.setName(normalizedName);
        discipline.setMinMembers(minMembers);
        discipline.setMaxMembers(maxMembers);

        return disciplineRepository.save(discipline);
    }

    public void deleteDiscipline(Long id) {
        Discipline discipline = disciplineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nie znaleziono dyscypliny."));

        if (teamRepository.existsBySportIgnoreCase(discipline.getName())) {
            throw new RuntimeException("Nie można usunąć dyscypliny, ponieważ są do niej przypisane drużyny.");
        }

        disciplineRepository.delete(discipline);
    }

    public String getOrCreateDisciplineName(String name) {
        String trimmedName = name.trim().toLowerCase();

        String normalizedName =
                trimmedName.substring(0, 1).toUpperCase()
                        + trimmedName.substring(1);

        return disciplineRepository.findByNameIgnoreCase(normalizedName)
                .map(Discipline::getName)
                .orElseGet(() -> {
                    Discipline discipline = new Discipline();
                    discipline.setName(normalizedName);

                    Discipline saved = disciplineRepository.save(discipline);

                    return saved.getName();
                });
    }

    public List<Discipline> findSimilarDisciplines(String name) {
        if (name == null || name.isBlank()) {
            return List.of();
        }

        String checkedName = name.trim().toLowerCase();
        LevenshteinDistance distance = new LevenshteinDistance();

        return disciplineRepository.findAll().stream()
                .filter(discipline -> {
                    String existingName = discipline.getName().toLowerCase();

                    int result = distance.apply(checkedName, existingName);

                    return result <= 2 && !existingName.equals(checkedName);
                })
                .toList();
    }

    private void validateMemberLimits(Integer minMembers, Integer maxMembers) {

        if (minMembers == null || maxMembers == null) {
            throw new RuntimeException("Minimalna i maksymalna liczba członków jest wymagana.");
        }

        if (minMembers < 1) {
            throw new RuntimeException("Minimalna liczba członków musi być większa od 0.");
        }

        if (maxMembers < minMembers) {
            throw new RuntimeException("Maksymalna liczba członków nie może być mniejsza niż minimalna.");
        }

        if (maxMembers > 100) {
            throw new RuntimeException("Maksymalna liczba członków jest zbyt duża.");
        }
    }

    public Discipline findByName(String name) {
        return disciplineRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new RuntimeException("Nie znaleziono dyscypliny."));
    }
}