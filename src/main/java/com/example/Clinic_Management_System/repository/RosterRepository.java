package com.example.Clinic_Management_System.repository;

import com.example.Clinic_Management_System.model.Roster;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// මෙතන public interface RosterRepository කියලා තියෙන්නම ඕනේ
public interface RosterRepository extends JpaRepository<Roster, Long> {
    List<Roster> findByDoctorId(Long doctorId);
}