package com.HoloClip.Collector.service;

import com.HoloClip.Collector.mapper.YoutubeVideoMapper;
import com.HoloClip.Collector.model.YoutubeVideo;
import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class YoutubeVideoService {

    private final YoutubeVideoMapper youtubeVideoMapper;

    @Autowired
    public YoutubeVideoService(YoutubeVideoMapper youtubeVideoMapper) {
        this.youtubeVideoMapper = youtubeVideoMapper;
    }

    public Page<YoutubeVideo> getVideos(String search, String channelId, int page, int size) {
        // PageHelper counts pages from 1, but our frontend sends 0-based page index.
        // We also explicitly pass the sorting order to PageHelper.
        PageHelper.startPage(page + 1, size, "published_at DESC");
        return (Page<YoutubeVideo>) youtubeVideoMapper.findVideosByCriteria(search, channelId);
    }
}