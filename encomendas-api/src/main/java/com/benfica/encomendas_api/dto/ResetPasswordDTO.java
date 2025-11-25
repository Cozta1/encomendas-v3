package com.benfica.encomendas_api.dto;

import lombok.Data;

@Data
public class ResetPasswordDTO {
    private String email;
    private String token;
    private String newPassword;
}