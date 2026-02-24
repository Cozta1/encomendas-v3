package com.benfica.encomendas_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EncomendasApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(EncomendasApiApplication.class, args);
	}

}
