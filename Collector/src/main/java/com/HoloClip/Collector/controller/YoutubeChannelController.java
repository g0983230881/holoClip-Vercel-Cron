package com.HoloClip.Collector.controller;

import com.HoloClip.Collector.model.YoutubeChannel;
import com.HoloClip.Collector.service.YoutubeChannelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/channels")
public class YoutubeChannelController {

    private final YoutubeChannelService youtubeChannelService;

    public YoutubeChannelController(YoutubeChannelService youtubeChannelService) {
        this.youtubeChannelService = youtubeChannelService;
    }

    @PostMapping
    public ResponseEntity<YoutubeChannel> addChannel(@Valid @RequestBody Map<String, String> payload) throws IOException {
        String channelId = payload.get("channelId");
        YoutubeChannel newChannel = youtubeChannelService.addChannel(channelId);
        return new ResponseEntity<>(newChannel, HttpStatus.CREATED);
    }

    @PutMapping("/{channelId}/verify")
    public ResponseEntity<YoutubeChannel> updateVerificationStatus(@PathVariable String channelId, @RequestBody Map<String, Boolean> payload) {
        Boolean isVerified = payload.get("isVerified");
        YoutubeChannel updatedChannel = youtubeChannelService.updateVerificationStatus(channelId, isVerified);
        return ResponseEntity.ok(updatedChannel);
    }

    @GetMapping("/unverified")
    public ResponseEntity<List<YoutubeChannel>> getUnverifiedChannels() {
        List<YoutubeChannel> channels = youtubeChannelService.getUnverifiedChannels();
        return ResponseEntity.ok(channels);
    }
}