package com.HoloClip.Collector.model;

import java.time.OffsetDateTime;

public class YoutubeVideo {
    private String videoId;
    private String channelId;
    private String channelTitle;
    private String title;
    private String thumbnailUrl;
    private OffsetDateTime publishedAt;
    private String channelThumbnailUrl;

    // Getters and Setters
    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public String getChannelId() {
        return channelId;
    }

    public void setChannelId(String channelId) {
        this.channelId = channelId;
    }

    public String getChannelTitle() {
        return channelTitle;
    }

    public void setChannelTitle(String channelTitle) {
        this.channelTitle = channelTitle;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public OffsetDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(OffsetDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getChannelThumbnailUrl() {
        return channelThumbnailUrl;
    }

    public void setChannelThumbnailUrl(String channelThumbnailUrl) {
        this.channelThumbnailUrl = channelThumbnailUrl;
    }
}