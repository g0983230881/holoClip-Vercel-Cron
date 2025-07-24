package com.HoloClip.Collector.controller;

import com.HoloClip.Collector.model.PageResponse;
import com.HoloClip.Collector.model.YoutubeChannel;
import com.HoloClip.Collector.service.YoutubeChannelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import com.github.pagehelper.Page;
import org.springframework.util.StringUtils;

@RestController
@RequestMapping("/api/channels")
@CrossOrigin(origins = "http://localhost:5173")
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

    @GetMapping
    public ResponseEntity<PageResponse<YoutubeChannel>> getChannels(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean isVerified,
            @RequestParam(required = false) String channelName,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String sortColumn = "created_at";
        String sortDirection = "DESC";

        if (StringUtils.hasText(sort)) {
            String[] sortParams = sort.split(",");
            sortColumn = sortParams[0];
            if (sortParams.length > 1) {
                sortDirection = sortParams[1];
            }
        }

        Page<YoutubeChannel> channels = youtubeChannelService.getChannels(isVerified, channelName, page, size, sortColumn, sortDirection);
        return ResponseEntity.ok(new PageResponse<>(channels));
    }

    @GetMapping("/{channelId}")
    public ResponseEntity<YoutubeChannel> getChannelById(@PathVariable String channelId) {
        YoutubeChannel channel = youtubeChannelService.getChannelById(channelId);
        return ResponseEntity.ok(channel);
    }

    @PatchMapping("/{channelId}")
    public ResponseEntity<YoutubeChannel> updateChannel(@PathVariable String channelId, @RequestBody Map<String, Object> updates) {
        YoutubeChannel updatedChannel = youtubeChannelService.updateChannel(channelId, updates);
        return ResponseEntity.ok(updatedChannel);
    }

    @SuppressWarnings("unchecked")
    @PatchMapping("/batch-verify")
    public ResponseEntity<Void> batchUpdateVerificationStatus(@RequestBody Map<String, Object> payload) {
        List<String> channelIds = (List<String>) payload.get("channelIds");
        Boolean isVerified = (Boolean) payload.get("isVerified");

        if (channelIds == null || channelIds.isEmpty() || isVerified == null) {
            return ResponseEntity.badRequest().build();
        }

        youtubeChannelService.batchUpdateVerificationStatus(channelIds, isVerified);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteChannels(@RequestBody Map<String, List<String>> payload) {
        List<String> channelIds = payload.get("channelIds");
        youtubeChannelService.deleteChannels(channelIds);
        return ResponseEntity.noContent().build();
    }
}
