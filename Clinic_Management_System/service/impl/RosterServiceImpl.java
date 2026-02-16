package com.example.Clinic_Management_System.service.impl;

import com.example.Clinic_Management_System.model.Roster;
import com.example.Clinic_Management_System.repository.RosterRepository;
import com.example.Clinic_Management_System.service.RosterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class RosterServiceImpl implements RosterService {

    @Autowired
    private RosterRepository rosterRepository;

    @Override
    public Roster saveRoster(Roster roster) {

        // ✅ 1. Set working hours based on shift
        switch (roster.getShiftStatus()) {

            case "Full Duty":
                roster.setStartTime(LocalTime.of(9, 0));
                roster.setEndTime(LocalTime.of(17, 0));
                break;

            case "Morning":
                roster.setStartTime(LocalTime.of(9, 0));
                roster.setEndTime(LocalTime.of(13, 0));
                break;

            case "Evening":
                roster.setStartTime(LocalTime.of(13, 0));
                roster.setEndTime(LocalTime.of(17, 0));
                break;

            case "Off":
                roster.setStartTime(null);
                roster.setEndTime(null);
                break;

            default:
                throw new IllegalArgumentException("Invalid shift type");
        }

        // ✅ 2. Check existing record
        Roster existingRoster = rosterRepository.findByDoctorIdAndDate(
                roster.getDoctor().getId(),
                roster.getDate());

        if (existingRoster != null) {

            System.out.println("Updating Roster: "
                    + roster.getDate() + " -> "
                    + roster.getShiftStatus());

            existingRoster.setShiftStatus(roster.getShiftStatus());
            existingRoster.setStartTime(roster.getStartTime());
            existingRoster.setEndTime(roster.getEndTime());

            return rosterRepository.save(existingRoster);

        } else {

            System.out.println("Creating New Roster: "
                    + roster.getDate() + " -> "
                    + roster.getShiftStatus());

            return rosterRepository.save(roster);
        }
    }

    @Override
    public List<Roster> getRosterByDoctor(Long doctorId) {
        return rosterRepository.findByDoctorId(doctorId);
    }

    @Override
    public List<LocalTime> getAvailableSlots(Long doctorId, LocalDate date) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getAvailableSlots'");
    }
}