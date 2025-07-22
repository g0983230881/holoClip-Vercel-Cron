package com.HoloClip.Collector.config;

import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.youtube.YouTube;
import com.HoloClip.Collector.exception.YouTubeApiMisconfigurationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class YouTubeApiConfig {

    private static final Logger logger = LoggerFactory.getLogger(YouTubeApiConfig.class);

    @Value("${youtube.api.key}")
    private String youtubeApiKey;

    @Bean
    public YouTube youtube() {
        if (youtubeApiKey == null || youtubeApiKey.isEmpty() || "YOUR_API_KEY".equals(youtubeApiKey)) {
            logger.error("YouTube API key is missing or not configured in application.properties. Please provide a valid key for 'youtube.api.key'.");
            throw new YouTubeApiMisconfigurationException("youtube.api.key is missing or not configured in application.properties!");
        }

        HttpRequestInitializer requestInitializer = new HttpRequestInitializer() {
            @Override
            public void initialize(com.google.api.client.http.HttpRequest request) throws java.io.IOException {
                request.getUrl().put("key", youtubeApiKey);
            }
        };

        try {
            logger.info("Initializing YouTube bean with Application Name: holoClipCenter");
            return new YouTube.Builder(httpTransport(), jsonFactory(), requestInitializer)
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