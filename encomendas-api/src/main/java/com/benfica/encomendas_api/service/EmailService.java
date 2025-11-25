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
            message.setFrom("noreply@encomendas.com");
            message.setTo(para);
            message.setSubject(assunto);
            message.setText(texto);
            mailSender.send(message);
        } catch (Exception e) {
            // Em ambiente de dev sem SMTP real, imprime no console
            System.out.println("---- EMAIL SIMULADO ----");
            System.out.println("Para: " + para);
            System.out.println("Assunto: " + assunto);
            System.out.println("Corpo: " + texto);
            System.out.println("------------------------");
            // Não relança erro para não quebrar o fluxo se o SMTP falhar em dev
        }
    }
}