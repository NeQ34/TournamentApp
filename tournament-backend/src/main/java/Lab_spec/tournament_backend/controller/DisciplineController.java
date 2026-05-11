package Lab_spec.tournament_backend.controller;

import Lab_spec.tournament_backend.model.Discipline;
import Lab_spec.tournament_backend.service.DisciplineService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class DisciplineController {

    private final DisciplineService disciplineService;

    public DisciplineController(DisciplineService disciplineService) {
        this.disciplineService = disciplineService;
    }

    @GetMapping("/api/disciplines")
    public ResponseEntity<List<Discipline>> getAllDisciplines() {
        return ResponseEntity.ok(disciplineService.getAllDisciplines());
    }

    @PostMapping("/api/admin/disciplines")
    public ResponseEntity<Discipline> addDiscipline(@RequestBody Map<String, Object> body) {
        Discipline discipline = disciplineService.addDiscipline(
                body.get("name").toString(),
                Integer.valueOf(body.get("minMembers").toString()),
                Integer.valueOf(body.get("maxMembers").toString())
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(discipline);
    }

    @PutMapping("/api/admin/disciplines/{id}")
    public ResponseEntity<Discipline> updateDiscipline(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.ok(disciplineService.updateDiscipline(
                id,
                body.get("name").toString(),
                Integer.valueOf(body.get("minMembers").toString()),
                Integer.valueOf(body.get("maxMembers").toString())
        ));
    }

    @DeleteMapping("/api/admin/disciplines/{id}")
    public ResponseEntity<Void> deleteDiscipline(@PathVariable Long id) {
        disciplineService.deleteDiscipline(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/disciplines/similar")
    public ResponseEntity<List<Discipline>> findSimilarDisciplines(
            @RequestParam String name
    ) {
        return ResponseEntity.ok(disciplineService.findSimilarDisciplines(name));
    }
}