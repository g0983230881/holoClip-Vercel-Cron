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
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

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
                true, // isVerified
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

    public Page<YoutubeChannel> getChannels(Boolean isVerified, String channelName, Pageable pageable) {
        String sortColumn = "created_at";
        String sortDirection = "DESC";

        if (pageable.getSort().isSorted()) {
            Sort.Order order = pageable.getSort().stream().findFirst().orElse(null);
            if (order != null) {
                sortColumn = convertSortPropertyToColumn(order.getProperty());
                sortDirection = order.getDirection().name();
            }
        }

        List<YoutubeChannel> channels = youtubeChannelMapper.findAll(
                isVerified,
                channelName,
                sortColumn,
                sortDirection,
                pageable.getPageSize(),
                (int) pageable.getOffset()
        );
        Long total = youtubeChannelMapper.countAll(isVerified, channelName);
        return new PageImpl<>(channels, pageable, total);
    }

    public YoutubeChannel getChannelById(String channelId) {
        return youtubeChannelMapper.findByChannelId(channelId)
                .orElseThrow(() -> new ChannelNotFoundException("Channel with ID " + channelId + " not found."));
    }

    @Transactional
    public YoutubeChannel updateChannel(String channelId, Map<String, Object> updates) {
        YoutubeChannel channel = youtubeChannelMapper.findByChannelId(channelId)
                .orElseThrow(() -> new ChannelNotFoundException("Channel with ID " + channelId + " not found."));

        updates.forEach((key, value) -> {
            switch (key) {
                case "channelName":
                    channel.setChannelName((String) value);
                    break;
                case "isVerified":
                    channel.setIsVerified((Boolean) value);
                    break;
                // Add other fields as needed
            }
        });
        channel.setLastUpdated(OffsetDateTime.now());
        youtubeChannelMapper.updateChannel(channel);
        return channel;
    }

    @Transactional
    public void deleteChannels(List<String> channelIds) {
        if (channelIds == null || channelIds.isEmpty()) {
            return;
        }
        youtubeChannelMapper.deleteByChannelIds(channelIds);
    }

    @Transactional
    public void batchUpdateVerificationStatus(List<String> channelIds, boolean isVerified) {
        if (channelIds == null || channelIds.isEmpty()) {
            return;
        }
        youtubeChannelMapper.updateVerificationStatusForIds(channelIds, isVerified);
    }

    private String convertSortPropertyToColumn(String property) {
        switch (property) {
            case "subscriberCount":
                return "subscriber_count";
            case "videoCount":
                return "video_count";
            case "lastUpdated":
                return "last_updated";
            case "createdAt":
                return "created_at";
            case "channelName":
                return "channel_name";
            default:
                return "created_at"; // Default sort column
        }
    }
}
