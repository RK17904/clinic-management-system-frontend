package com.example.Clinic_Management_System.repository;

import com.example.Clinic_Management_System.model.Roster;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDate;

public interface RosterRepository extends JpaRepository<Roster, Long> {
    
    // දොස්තරගේ ID එකෙන් ඔක්කොම ගන්න
    List<Roster> findByDoctorId(Long doctorId);

    // ✅ මේ දොස්තරට මේ දවසේ Record එකක් තියෙනවද බලන්න (Update Logic එකට මේක ඕනේ)
    Roster findByDoctorIdAndDate(Long doctorId, LocalDate date);
}