package com.example.Clinic_Management_System.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "rosters")
public class Roster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;
    private String shiftStatus; // Full Duty, Morning, Evening, Off

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;
}