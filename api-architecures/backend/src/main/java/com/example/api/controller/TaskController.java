package com.example.api.controller;

import com.example.api.dto.StatsDto;
import com.example.api.exception.ResourceNotFoundException;
import com.example.api.model.TaskItem;
import com.example.api.model.TaskPriority;
import com.example.api.model.TaskStatus;
import com.example.api.repository.TaskRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
@Tag(name = "Task Management API", description = "Endpoints for creating, querying, updating, and deleting tasks")
public class TaskController {

    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @PostConstruct
    public void initSampleData() {
        if (taskRepository.count() == 0) {
            taskRepository.save(new TaskItem(
                    "Configure CORS Policy",
                    "Setup cross-origin request policies allowing React frontend to connect seamlessly.",
                    TaskStatus.COMPLETED,
                    TaskPriority.HIGH,
                    "Security"
            ));
            taskRepository.save(new TaskItem(
                    "Integrate OpenAPI / Swagger UI",
                    "Auto-generate interactive API documentation endpoints accessible via /swagger-ui.html.",
                    TaskStatus.COMPLETED,
                    TaskPriority.HIGH,
                    "Documentation"
            ));
            taskRepository.save(new TaskItem(
                    "PostgreSQL Containerization",
                    "Configure Docker Compose environment variables and volume bindings for persistent database storage.",
                    TaskStatus.IN_PROGRESS,
                    TaskPriority.CRITICAL,
                    "DevOps"
            ));
            taskRepository.save(new TaskItem(
                    "React UI Glassmorphism Theme",
                    "Design modern visual aesthetic dashboard with live health indicators and responsive task cards.",
                    TaskStatus.IN_PROGRESS,
                    TaskPriority.MEDIUM,
                    "Frontend"
            ));
            taskRepository.save(new TaskItem(
                    "Implement Rate Limiting & Auth",
                    "Add Spring Security OAuth2 JWT authentication layer and bucket rate limiting.",
                    TaskStatus.BACKLOG,
                    TaskPriority.MEDIUM,
                    "Security"
            ));
        }
    }

    @Operation(summary = "Get all tasks", description = "Retrieve a list of all tasks with optional search, status, and category filtering.")
    @GetMapping
    public ResponseEntity<List<TaskItem>> getAllTasks(
            @Parameter(description = "Search title or description substring") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by status (BACKLOG, IN_PROGRESS, UNDER_REVIEW, COMPLETED)") @RequestParam(required = false) TaskStatus status,
            @Parameter(description = "Filter by category name") @RequestParam(required = false) String category
    ) {
        List<TaskItem> tasks = taskRepository.searchTasks(search, status, category);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Get task by ID", description = "Fetch a single task by its unique database identifier.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Task found"),
            @ApiResponse(responseCode = "404", description = "Task not found with given ID")
    })
    @GetMapping("/{id}")
    public ResponseEntity<TaskItem> getTaskById(@PathVariable Long id) {
        TaskItem task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return ResponseEntity.ok(task);
    }

    @Operation(summary = "Create a new task", description = "Add a new task entity to the database.")
    @ApiResponse(responseCode = "201", description = "Task created successfully")
    @PostMapping
    public ResponseEntity<TaskItem> createTask(@Valid @RequestBody TaskItem task) {
        TaskItem created = taskRepository.save(task);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @Operation(summary = "Update task by ID", description = "Modify an existing task entity.")
    @PutMapping("/{id}")
    public ResponseEntity<TaskItem> updateTask(@PathVariable Long id, @Valid @RequestBody TaskItem taskDetails) {
        TaskItem existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        existingTask.setTitle(taskDetails.getTitle());
        existingTask.setDescription(taskDetails.getDescription());
        existingTask.setStatus(taskDetails.getStatus());
        existingTask.setPriority(taskDetails.getPriority());
        existingTask.setCategory(taskDetails.getCategory());

        TaskItem updated = taskRepository.save(existingTask);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Delete task by ID", description = "Remove a task entity from the database.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteTask(@PathVariable Long id) {
        TaskItem task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        taskRepository.delete(task);
        Map<String, Boolean> response = new HashMap<>();
        response.put("deleted", Boolean.TRUE);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get Task Statistics", description = "Aggregate statistics summarizing counts by status, priority, and category.")
    @GetMapping("/stats")
    public ResponseEntity<StatsDto> getStats() {
        long total = taskRepository.count();
        long backlog = taskRepository.countByStatus(TaskStatus.BACKLOG);
        long inProgress = taskRepository.countByStatus(TaskStatus.IN_PROGRESS);
        long underReview = taskRepository.countByStatus(TaskStatus.UNDER_REVIEW);
        long completed = taskRepository.countByStatus(TaskStatus.COMPLETED);
        long highPriority = taskRepository.countByPriority(TaskPriority.HIGH) + taskRepository.countByPriority(TaskPriority.CRITICAL);

        List<String> categories = taskRepository.findDistinctCategories();
        Map<String, Long> categoryMap = new HashMap<>();
        for (String cat : categories) {
            categoryMap.put(cat, (long) taskRepository.findByCategory(cat).size());
        }

        StatsDto stats = new StatsDto(total, backlog, inProgress, underReview, completed, highPriority, categoryMap);
        return ResponseEntity.ok(stats);
    }

    @Operation(summary = "Get Distinct Categories", description = "List all category names currently assigned to tasks.")
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(taskRepository.findDistinctCategories());
    }
}
