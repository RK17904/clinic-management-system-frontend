package com.example.Clinic_Management_System.service.impl;

import com.example.Clinic_Management_System.model.Roster;
import com.example.Clinic_Management_System.repository.RosterRepository;
import com.example.Clinic_Management_System.service.RosterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RosterServiceImpl implements RosterService {

    @Autowired
    private RosterRepository rosterRepository;

    @Override
    public Roster saveRoster(Roster roster) {
        // 1. කලින් Record එකක් තියෙනවද බලනවා
        Roster existingRoster = rosterRepository.findByDoctorIdAndDate(
            roster.getDoctor().getId(), 
            roster.getDate()
        );

        if (existingRoster != null) {
            // 2. තියෙනවා නම් Update කරනවා
            System.out.println("Updating Roster: " + roster.getDate() + " -> " + roster.getShiftStatus());
            existingRoster.setShiftStatus(roster.getShiftStatus());
            return rosterRepository.save(existingRoster);
        } else {
            // 3. නැත්නම් අලුත් එකක් Save කරනවා
            System.out.println("Creating New Roster: " + roster.getDate() + " -> " + roster.getShiftStatus());
            return rosterRepository.save(roster);
        }
    }

    @Override
    public List<Roster> getRosterByDoctor(Long doctorId) {
        return rosterRepository.findByDoctorId(doctorId);
    }
}