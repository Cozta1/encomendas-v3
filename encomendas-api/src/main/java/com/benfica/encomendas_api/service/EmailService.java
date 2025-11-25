package com.benfica.encomendas_api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarEmail(String para, String assunto, String texto) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@farmaciabenfica.com");
            message.setTo(para);
            message.setSubject(assunto);
            message.setText(texto);
            mailSender.send(message);
        } catch (Exception e) {
            // Em ambiente de dev sem SMTP configurado, apenas logamos para não quebrar o app
            System.out.println("--- SIMULAÇÃO DE EMAIL ---");
            System.out.println("Para: " + para);
            System.out.println("Assunto: " + assunto);
            System.out.println("Texto: " + texto);
            System.out.println("--------------------------");
        }
    }
}