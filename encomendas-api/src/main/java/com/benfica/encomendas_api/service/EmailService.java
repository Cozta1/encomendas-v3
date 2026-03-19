package com.benfica.encomendas_api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@encomendas.com}")
    private String fromAddress;

    public void enviarEmail(String para, String assunto, String texto) {
        if (para == null || para.isBlank()) {
            logger.warn("Tentativa de enviar email sem destinatário. Assunto: {}", assunto);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(para);
            message.setSubject(assunto);
            message.setText(texto);
            mailSender.send(message);
            logger.info("Email enviado com sucesso para: {}", para);
        } catch (MailException e) {
            logger.error("Falha ao enviar email para: {} | Assunto: {} | Erro: {}", para, assunto, e.getMessage());
        }
    }
}