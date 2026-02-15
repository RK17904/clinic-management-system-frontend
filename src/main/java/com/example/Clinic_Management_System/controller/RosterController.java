package com.example.Clinic_Management_System.controller;

import com.example.Clinic_Management_System.model.Roster;
import com.example.Clinic_Management_System.service.RosterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/rosters")
@CrossOrigin(origins = "*") // Frontend එකට ඉඩ දෙනවා
public class RosterController {

    @Autowired
    private RosterService rosterService;

    @PostMapping
    public Roster createRoster(@RequestBody Roster roster) {
        return rosterService.saveRoster(roster);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Roster> getRoster(@PathVariable Long doctorId) {
        return rosterService.getRosterByDoctor(doctorId);
    }
}