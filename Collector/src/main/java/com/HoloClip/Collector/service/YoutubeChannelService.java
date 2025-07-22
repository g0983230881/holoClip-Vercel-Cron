package com.HoloClip.Collector.service;

import com.google.api.services.youtube.model.Channel;
import com.HoloClip.Collector.exception.ChannelAlreadyExistsException;
import com.HoloClip.Collector.exception.ChannelNotFoundException;
import com.HoloClip.Collector.mapper.YoutubeChannelMapper;
import com.HoloClip.Collector.model.YoutubeChannel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class YoutubeChannelService {

    private final YoutubeChannelMapper youtubeChannelMapper;
    private final YouTubeApiClientService youTubeApiClientService;

    public YoutubeChannelService(YoutubeChannelMapper youtubeChannelMapper, YouTubeApiClientService youTubeApiClientService) {
        this.youtubeChannelMapper = youtubeChannelMapper;
        this.youTubeApiClientService = youTubeApiClientService;
    }

    @Transactional
    public YoutubeChannel addChannel(String channelId) throws IOException {
        youtubeChannelMapper.findByChannelId(channelId).ifPresent(c -> {
            throw new ChannelAlreadyExistsException("Channel with ID " + channelId + " already exists.");
        });

        Channel youtubeChannelData = youTubeApiClientService.getChannelDetails(channelId);
        if (youtubeChannelData == null) {
            throw new ChannelNotFoundException("Channel with ID " + channelId + " not found on YouTube.");
        }

        YoutubeChannel newChannel = new YoutubeChannel(
                youtubeChannelData.getId(),
                youtubeChannelData.getSnippet().getTitle(),
                youtubeChannelData.getStatistics().getSubscriberCount().longValue(),
                youtubeChannelData.getStatistics().getVideoCount().longValue(),
                youtubeChannelData.getSnippet().getThumbnails().getDefault().getUrl(),
                false, // isVerified
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );

        youtubeChannelMapper.insert(newChannel);
        return newChannel;
    }

    @Transactional
    public YoutubeChannel updateVerificationStatus(String channelId, boolean isVerified) {
        YoutubeChannel channel = youtubeChannelMapper.findByChannelId(channelId)
                .orElseThrow(() -> new ChannelNotFoundException("Channel with ID " + channelId + " not found."));

        youtubeChannelMapper.updateVerificationStatus(channelId, isVerified);
        channel.setIsVerified(isVerified);
        channel.setLastUpdated(OffsetDateTime.now());
        return channel;
    }

    public List<YoutubeChannel> getUnverifiedChannels() {
        return youtubeChannelMapper.findByIsVerifiedFalse();
    }
}