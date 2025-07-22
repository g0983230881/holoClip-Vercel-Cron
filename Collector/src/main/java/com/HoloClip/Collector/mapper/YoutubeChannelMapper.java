package com.HoloClip.Collector.mapper;

import com.HoloClip.Collector.model.YoutubeChannel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface YoutubeChannelMapper {

    Optional<YoutubeChannel> findByChannelId(@Param("channelId") String channelId);

    List<YoutubeChannel> findByIsVerifiedFalse();

    void insert(YoutubeChannel channel);

    void updateVerificationStatus(@Param("channelId") String channelId, @Param("isVerified") boolean isVerified);

}