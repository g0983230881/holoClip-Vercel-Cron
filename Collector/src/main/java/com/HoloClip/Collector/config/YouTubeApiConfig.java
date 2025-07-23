package com.HoloClip.Collector.config;

import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.youtube.YouTube;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class YouTubeApiConfig {

    private static final Logger logger = LoggerFactory.getLogger(YouTubeApiConfig.class);

    @Bean
    public YouTube youtube() {
        try {
            logger.info("Initializing YouTube bean with Application Name: holoClipCenter");
            // The API key will be set per-request in the YouTubeApiClientService
            return new YouTube.Builder(httpTransport(), jsonFactory(), request -> {})
                    .setApplicationName("holoClipCenter")
                    .build();
        } catch (Exception e) {
            logger.error("Failed to create YouTube bean", e);
            throw new RuntimeException("Failed to create YouTube bean", e);
        }
    }

    @Bean
    public HttpTransport httpTransport() {
        return new NetHttpTransport();
    }

    @Bean
    public JsonFactory jsonFactory() {
        return new GsonFactory();
    }
}
