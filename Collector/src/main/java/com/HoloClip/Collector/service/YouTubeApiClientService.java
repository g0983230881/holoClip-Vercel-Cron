package com.HoloClip.Collector.service;

import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.Channel;
import com.google.api.services.youtube.model.ChannelListResponse;
import com.HoloClip.Collector.exception.YouTubeApiMisconfigurationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class YouTubeApiClientService {

    private static final Logger logger = LoggerFactory.getLogger(YouTubeApiClientService.class);

    private final YouTube youtube;
    private final String youtubeApiKey;

    public YouTubeApiClientService(YouTube youtube, @Value("${youtube.api.key}") String youtubeApiKey) {
        this.youtube = youtube;
        this.youtubeApiKey = youtubeApiKey;
    }

    public Channel getChannelDetails(String channelId) throws IOException {
        if (youtubeApiKey == null || youtubeApiKey.isEmpty() || "YOUR_API_KEY".equals(youtubeApiKey)) {
            throw new YouTubeApiMisconfigurationException("YouTube API key is not configured. Please check your application.properties.");
        }

        YouTube.Channels.List channelRequest = youtube.channels().list("snippet,statistics");
        channelRequest.setId(channelId);
        channelRequest.setKey(youtubeApiKey); // Directly set the API key on the request

        ChannelListResponse response = channelRequest.execute();
        List<Channel> channels = response.getItems();

        if (channels != null && !channels.isEmpty()) {
            return channels.get(0);
        } else {
            logger.warn("YouTube API returned an empty result for channelId: {}", channelId);
            return null;
        }
    }
}
