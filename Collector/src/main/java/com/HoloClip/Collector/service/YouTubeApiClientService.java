package com.HoloClip.Collector.service;

import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.Channel;
import com.google.api.services.youtube.model.ChannelListResponse;
import com.HoloClip.Collector.exception.YouTubeApiMisconfigurationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class YouTubeApiClientService {

    private static final Logger logger = LoggerFactory.getLogger(YouTubeApiClientService.class);
    private static final int MAX_CONSECUTIVE_EMPTY_RESULTS = 3;

    private final YouTube youtube;
    private final AtomicInteger consecutiveEmptyResults = new AtomicInteger(0);

    public YouTubeApiClientService(YouTube youtube) {
        this.youtube = youtube;
    }

    public Channel getChannelDetails(String channelId) throws IOException {
        if (consecutiveEmptyResults.get() >= MAX_CONSECUTIVE_EMPTY_RESULTS) {
            throw new YouTubeApiMisconfigurationException("YouTube API has returned empty results multiple times. Please check your API key or configuration.");
        }

        YouTube.Channels.List channelRequest = youtube.channels().list("snippet,statistics");
        channelRequest.setId(channelId);

        ChannelListResponse response = channelRequest.execute();
        List<Channel> channels = response.getItems();

        if (channels != null && !channels.isEmpty()) {
            consecutiveEmptyResults.set(0); // Reset counter on success
            return channels.get(0);
        } else {
            int emptyCount = consecutiveEmptyResults.incrementAndGet();
            logger.warn("YouTube API returned an empty result for channelId: {}. Consecutive empty results: {}", channelId, emptyCount);
            return null;
        }
    }
}