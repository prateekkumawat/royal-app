package com.example.api.dto;

import java.util.Map;

public class StatsDto {
    private long totalTasks;
    private long backlogCount;
    private long inProgressCount;
    private long underReviewCount;
    private long completedCount;
    private long highPriorityCount;
    private Map<String, Long> categoryCounts;

    public StatsDto() {
    }

    public StatsDto(long totalTasks, long backlogCount, long inProgressCount, long underReviewCount,
                    long completedCount, long highPriorityCount, Map<String, Long> categoryCounts) {
        this.totalTasks = totalTasks;
        this.backlogCount = backlogCount;
        this.inProgressCount = inProgressCount;
        this.underReviewCount = underReviewCount;
        this.completedCount = completedCount;
        this.highPriorityCount = highPriorityCount;
        this.categoryCounts = categoryCounts;
    }

    public long getTotalTasks() {
        return totalTasks;
    }

    public void setTotalTasks(long totalTasks) {
        this.totalTasks = totalTasks;
    }

    public long getBacklogCount() {
        return backlogCount;
    }

    public void setBacklogCount(long backlogCount) {
        this.backlogCount = backlogCount;
    }

    public long getInProgressCount() {
        return inProgressCount;
    }

    public void setInProgressCount(long inProgressCount) {
        this.inProgressCount = inProgressCount;
    }

    public long getUnderReviewCount() {
        return underReviewCount;
    }

    public void setUnderReviewCount(long underReviewCount) {
        this.underReviewCount = underReviewCount;
    }

    public long getCompletedCount() {
        return completedCount;
    }

    public void setCompletedCount(long completedCount) {
        this.completedCount = completedCount;
    }

    public long getHighPriorityCount() {
        return highPriorityCount;
    }

    public void setHighPriorityCount(long highPriorityCount) {
        this.highPriorityCount = highPriorityCount;
    }

    public Map<String, Long> getCategoryCounts() {
        return categoryCounts;
    }

    public void setCategoryCounts(Map<String, Long> categoryCounts) {
        this.categoryCounts = categoryCounts;
    }
}
