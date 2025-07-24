package com.HoloClip.Collector.mapper;

import com.HoloClip.Collector.model.YoutubeVideo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface YoutubeVideoMapper {
    List<YoutubeVideo> findVideosByCriteria(@Param("search") String search, @Param("channelId") String channelId);
}