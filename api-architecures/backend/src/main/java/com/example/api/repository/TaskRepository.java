package com.example.api.repository;


import com.example.api.model.TaskItem;
import com.example.api.model.TaskPriority;
import com.example.api.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<TaskItem, Long> {

    List<TaskItem> findByStatus(TaskStatus status);

    List<TaskItem> findByCategory(String category);

    @Query("SELECT t FROM TaskItem t WHERE " +
           "(:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:category IS NULL OR LOWER(t.category) = LOWER(:category)) " +
           "ORDER BY t.updatedAt DESC")
    List<TaskItem> searchTasks(@Param("search") String search,
                               @Param("status") TaskStatus status,
                               @Param("category") String category);

    long countByStatus(TaskStatus status);

    long countByPriority(TaskPriority priority);

    @Query("SELECT DISTINCT t.category FROM TaskItem t WHERE t.category IS NOT NULL ORDER BY t.category ASC")
    List<String> findDistinctCategories();
}
