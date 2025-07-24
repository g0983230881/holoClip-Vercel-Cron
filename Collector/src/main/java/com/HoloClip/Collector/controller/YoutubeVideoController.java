package com.HoloClip.Collector.controller;

import com.HoloClip.Collector.model.PageResponse;
import com.HoloClip.Collector.model.YoutubeVideo;
import com.HoloClip.Collector.service.YoutubeVideoService;
import com.github.pagehelper.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/videos")
public class YoutubeVideoController {

    private final YoutubeVideoService youtubeVideoService;

    @Autowired
    public YoutubeVideoController(YoutubeVideoService youtubeVideoService) {
        this.youtubeVideoService = youtubeVideoService;
    }

    @CrossOrigin(origins = "http://localhost:5173")
    @GetMapping
    public ResponseEntity<PageResponse<YoutubeVideo>> getVideos(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String channelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<YoutubeVideo> videoPage = youtubeVideoService.getVideos(search, channelId, page, size);
        return ResponseEntity.ok(new PageResponse<>(videoPage));
    }
}