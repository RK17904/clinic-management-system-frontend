package com.example.Clinic_Management_System.service;

import com.example.Clinic_Management_System.model.Roster;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface RosterService {
    Roster saveRoster(Roster roster);

    List<Roster> getRosterByDoctor(Long doctorId);

    List<LocalTime> getAvailableSlots(Long doctorId, LocalDate date);
}