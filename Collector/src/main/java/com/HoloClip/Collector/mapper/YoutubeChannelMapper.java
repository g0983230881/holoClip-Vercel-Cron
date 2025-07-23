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

    List<YoutubeChannel> findAll(@Param("isVerified") Boolean isVerified,
                                 @Param("channelName") String channelName, // Re-add channelName
                                 @Param("sortColumn") String sortColumn,
                                 @Param("sortDirection") String sortDirection,
                                 @Param("limit") int limit,
                                 @Param("offset") int offset);

    Long countAll(@Param("isVerified") Boolean isVerified,
                  @Param("channelName") String channelName); // Re-add channelName

    void updateChannel(YoutubeChannel channel);

    void deleteByChannelId(@Param("channelId") String channelId);

    void deleteByChannelIds(@Param("channelIds") List<String> channelIds);

    void updateVerificationStatusForIds(@Param("channelIds") List<String> channelIds, @Param("isVerified") boolean isVerified);
}
