package com.HoloClip.Collector.model;

import java.time.OffsetDateTime;
import java.util.Objects;

public class YoutubeChannel {

    private String channelId;
    private String channelName;
    private Long subscriberCount;
    private Long videoCount;
    private String thumbnailUrl;
    private Boolean isVerified;
    private OffsetDateTime lastUpdated;
    private OffsetDateTime createdAt;

    public YoutubeChannel() {
    }

    public YoutubeChannel(String channelId, String channelName, Long subscriberCount, Long videoCount, String thumbnailUrl, Boolean isVerified, OffsetDateTime lastUpdated, OffsetDateTime createdAt) {
        this.channelId = channelId;
        this.channelName = channelName;
        this.subscriberCount = subscriberCount;
        this.videoCount = videoCount;
        this.thumbnailUrl = thumbnailUrl;
        this.isVerified = isVerified;
        this.lastUpdated = lastUpdated;
        this.createdAt = createdAt;
    }

    public String getChannelId() {
        return channelId;
    }

    public void setChannelId(String channelId) {
        this.channelId = channelId;
    }

    public String getChannelName() {
        return channelName;
    }

    public void setChannelName(String channelName) {
        this.channelName = channelName;
    }

    public Long getSubscriberCount() {
        return subscriberCount;
    }

    public void setSubscriberCount(Long subscriberCount) {
        this.subscriberCount = subscriberCount;
    }

    public Long getVideoCount() {
        return videoCount;
    }

    public void setVideoCount(Long videoCount) {
        this.videoCount = videoCount;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    public OffsetDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(OffsetDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        YoutubeChannel that = (YoutubeChannel) o;
        return Objects.equals(channelId, that.channelId) &&
                Objects.equals(channelName, that.channelName) &&
                Objects.equals(subscriberCount, that.subscriberCount) &&
                Objects.equals(videoCount, that.videoCount) &&
                Objects.equals(thumbnailUrl, that.thumbnailUrl) &&
                Objects.equals(isVerified, that.isVerified) &&
                Objects.equals(lastUpdated, that.lastUpdated) &&
                Objects.equals(createdAt, that.createdAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(channelId, channelName, subscriberCount, videoCount, thumbnailUrl, isVerified, lastUpdated, createdAt);
    }

    @Override
    public String toString() {
        return "YoutubeChannel{" +
                "channelId='" + channelId + '\'' +
                ", channelName='" + channelName + '\'' +
                ", subscriberCount=" + subscriberCount +
                ", videoCount=" + videoCount +
                ", thumbnailUrl='" + thumbnailUrl + '\'' +
                ", isVerified=" + isVerified +
                ", lastUpdated=" + lastUpdated +
                ", createdAt=" + createdAt +
                '}';
    }
}