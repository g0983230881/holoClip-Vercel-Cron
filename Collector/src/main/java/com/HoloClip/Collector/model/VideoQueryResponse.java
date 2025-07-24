package com.HoloClip.Collector.model;

import java.util.List;

public class VideoQueryResponse {
    private List<YoutubeVideo> videos;
    private List<YoutubeChannel> channels;

    public VideoQueryResponse(List<YoutubeVideo> videos, List<YoutubeChannel> channels) {
        this.videos = videos;
        this.channels = channels;
    }

    // Getters and Setters
    public List<YoutubeVideo> getVideos() {
        return videos;
    }

    public void setVideos(List<YoutubeVideo> videos) {
        this.videos = videos;
    }

    public List<YoutubeChannel> getChannels() {
        return channels;
    }

    public void setChannels(List<YoutubeChannel> channels) {
        this.channels = channels;
    }
}