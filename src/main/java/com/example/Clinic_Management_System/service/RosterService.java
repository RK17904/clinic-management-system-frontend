package com.example.Clinic_Management_System.service;

import com.example.Clinic_Management_System.model.Roster;
import com.example.Clinic_Management_System.repository.RosterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RosterService { // class නම හරියටම තියෙනවාද බලන්න
    @Autowired
    private RosterRepository rosterRepository;

    public Roster saveRoster(Roster roster) {
        return rosterRepository.save(roster);
    }

    public List<Roster> getRosterByDoctor(Long doctorId) {
        return rosterRepository.findByDoctorId(doctorId);
    }
}